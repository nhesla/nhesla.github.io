import java.awt.*;    
import java.applet.Applet;
import java.util.Random; 
 
public class Boss_creep extends Creep
{
    public Boss_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
		
	public Boss_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
}